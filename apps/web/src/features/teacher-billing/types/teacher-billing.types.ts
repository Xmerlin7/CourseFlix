export interface TeacherQuota {
  monthlyAllowance: number
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  /** 0-100, rounded; clamped at 100 even when usage exceeds the balance. */
  percentUsed: number
  resetAt: string
}

export interface AdminTeacherQuota extends TeacherQuota {
  teacherId: string
  teacherName: string
  teacherEmail: string
}

export interface TopUpQuotaPayload {
  credits: number
}
