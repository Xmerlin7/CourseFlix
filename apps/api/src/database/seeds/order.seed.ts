import { DataSource, IsNull } from 'typeorm';
import { CourseEntity } from '../../modules/courses/entities/course.entity';
import { EnrollmentEntity } from '../../modules/enrollments/entities/enrollment.entity';
import { OrderEntity } from '../../modules/commerce/entities/order.entity';
import { OrderItemEntity } from '../../modules/commerce/entities/order-item.entity';
import { PaymentEntity } from '../../modules/commerce/entities/payment.entity';
import { COURSE_PRICE_MINOR } from '../../modules/commerce/commerce.constants';

/**
 * Seeds a purchase history: mostly paid orders (so `/teacher/sales` has
 * real revenue and a real best-seller instead of every stat reading
 * zero), plus one still-pending order and one failed attempt so every
 * order/payment status is represented.
 *
 * Deliberately targets courses a student is *not* already enrolled in
 * (via `enrollment.seed.ts`'s fixture fan-out) and, on a `paid` order,
 * creates the matching enrollment itself — mirroring what a real checkout
 * confirmation does. This matters beyond realism:
 * `transactional-reset.seed.ts` identifies a checkout-created enrollment
 * by "this (student, course) pair also has an order row", and relies on
 * that being true *only* for enrollments a purchase actually produced. An
 * earlier version of this seed bought courses the student already had a
 * base-fixture enrollment in, which made every one of those look
 * checkout-created and get soft-deleted by `reset` — wiping the entire
 * enrollment fixture. Buying only *new* courses keeps that invariant
 * intact.
 *
 * Orders have no natural key to upsert against (a student can legitimately
 * buy the same course twice after a refund), so — like `agent_logs` — this
 * seed manufactures one: `idempotencyKey` is set to a fixed
 * `seed-order-{student}-{course}` marker and checked before insert, so a
 * plain `npm run seed` (no `reset`) doesn't duplicate rows.
 */
export async function seedOrders(
  dataSource: DataSource,
  { studentIds }: { studentIds: string[] },
): Promise<{ ordersCreated: number; paymentsCreated: number }> {
  const courseRepository = dataSource.getRepository(CourseEntity);
  const enrollmentRepository = dataSource.getRepository(EnrollmentEntity);
  const orderRepository = dataSource.getRepository(OrderEntity);
  const orderItemRepository = dataSource.getRepository(OrderItemEntity);
  const paymentRepository = dataSource.getRepository(PaymentEntity);

  const publishedCourses = await courseRepository.find({
    where: { status: 'published' },
  });
  if (publishedCourses.length === 0 || studentIds.length === 0) {
    return { ordersCreated: 0, paymentsCreated: 0 };
  }

  let ordersCreated = 0;
  let paymentsCreated = 0;

  // Every 5th purchase stays pending and every 7th fails, so all three
  // order statuses show up in the ledger instead of everything being paid.
  let purchaseIndex = 0;

  for (const [studentIndex, studentId] of studentIds.entries()) {
    // `EnrollmentEntity.deletedAt` is a plain column, not a
    // `@DeleteDateColumn` — TypeORM does not filter it automatically, so
    // a soft-deleted (reverted-by-reset) checkout enrollment would
    // otherwise still count as "already enrolled" here forever, making
    // that course permanently unpurchasable and `reset` converge to zero
    // orders after a couple of cycles. Every read against this entity
    // must filter it explicitly.
    const alreadyEnrolledCourseIds = new Set(
      (
        await enrollmentRepository.find({
          where: { studentId, deletedAt: IsNull() },
        })
      ).map((enrollment) => enrollment.courseId),
    );
    const purchasable = publishedCourses.filter(
      (course) => !alreadyEnrolledCourseIds.has(course.id),
    );
    if (purchasable.length === 0) continue;

    // Up to two new-to-this-student courses, staggered by student index
    // so purchases spread across the catalogue instead of everyone
    // buying the same one course.
    const coursesToBuy = [
      purchasable[studentIndex % purchasable.length],
      purchasable[(studentIndex + 1) % purchasable.length],
    ].filter(
      (course, index, all) =>
        all.findIndex((c) => c.id === course.id) === index,
    );

    for (const course of coursesToBuy) {
      purchaseIndex += 1;
      const idempotencyKey = `seed-order-${studentId}-${course.id}`;

      const existing = await orderRepository.findOne({
        where: { idempotencyKey },
      });
      if (existing) continue;

      const isFailed = purchaseIndex % 7 === 0;
      const isPending = !isFailed && purchaseIndex % 5 === 0;
      const status = isFailed ? 'failed' : isPending ? 'pending' : 'paid';

      const order = await orderRepository.save(
        orderRepository.create({
          studentId,
          status,
          paymentStatus: status,
          currency: 'EGP',
          totalMinor: COURSE_PRICE_MINOR,
          idempotencyKey,
          paidAt: status === 'paid' ? new Date() : null,
        }),
      );
      ordersCreated += 1;

      await orderItemRepository.save(
        orderItemRepository.create({
          orderId: order.id,
          courseId: course.id,
          titleSnapshot: course.title,
          priceMinor: COURSE_PRICE_MINOR,
        }),
      );

      await paymentRepository.save(
        paymentRepository.create({
          orderId: order.id,
          attemptNo: 1,
          status,
          method: 'test_adapter',
          externalRef: status === 'failed' ? 'test-declined' : 'test-ok',
          paymobOrderId: null,
        }),
      );
      paymentsCreated += 1;

      // Real checkout confirmation grants access on payment success —
      // mirror that here instead of leaving a `paid` order with no
      // matching enrollment. `uq_enrollments_student_course` is a plain
      // (non-partial) unique index, so a *soft-deleted* row from an
      // earlier reset cycle still occupies this (student, course) pair —
      // insert would violate it. Revive that row instead of creating a
      // second one, matching how a real repurchase would behave.
      if (status === 'paid') {
        const priorEnrollment = await enrollmentRepository.findOne({
          where: { studentId, courseId: course.id },
        });
        if (priorEnrollment) {
          await enrollmentRepository.update(priorEnrollment.id, {
            status: 'active',
            deletedAt: null,
          });
        } else {
          await enrollmentRepository.save(
            enrollmentRepository.create({
              studentId,
              courseId: course.id,
              status: 'active',
            }),
          );
        }
      }
    }
  }

  return { ordersCreated, paymentsCreated };
}
