import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Mirrors `intervention_evidence` from
 * `1785000062000-CreateInterventions.ts`. `detail` must always be a
 * short, deterministic description (e.g. "Quiz score 42% < 60%
 * threshold"), never raw chat/answer text — see
 * `common/ports/agent-log.port.ts`'s redaction contract, applied here
 * defensively even though this table has no teacher-facing read API yet.
 */
@Entity({ name: 'intervention_evidence' })
export class InterventionEvidenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_intervention_evidence_intervention')
  @Column({ name: 'intervention_id', type: 'uuid' })
  interventionId!: string;

  @Column({ name: 'evidence_type', type: 'text' })
  evidenceType!: string;

  // Polymorphic, no enforced FK by design (same posture as agent_logs).
  @Column({ name: 'evidence_ref_id', type: 'uuid', nullable: true })
  evidenceRefId!: string | null;

  @Column({ type: 'text' })
  detail!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
