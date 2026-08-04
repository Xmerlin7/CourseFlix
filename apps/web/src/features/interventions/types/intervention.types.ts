export type InterventionRuleKey =
  | 'low_quiz_score'
  | 'explicit_confusion_phrase'
  | 'repeated_concept_question'

export type InterventionStatus = 'active' | 'resolved'

export interface StudentIntervention {
  id: string
  courseId: string
  ruleKey: InterventionRuleKey
  weakConcept: string
  status: InterventionStatus
  miniQuizId: string | null
  createdAt: string
}

export interface TeacherIntervention extends StudentIntervention {
  studentId: string
  studentName: string
  ruleVersion: number
}
