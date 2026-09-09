/* Header: 입력 스키마. 클라이언트 폼과 서버 라우트가 같은 정의를 공유한다.
   검증 규칙이 두 군데로 갈라지면 반드시 어긋난다. */
import { z } from "zod";

export const CATEGORY_VALUES = ["CODING", "WRITING", "REASONING", "MULTIMODAL"] as const;

export const reviewInputSchema = z.object({
  ratings: z
    .array(
      z.object({
        category: z.enum(CATEGORY_VALUES),
        score: z.number().int().min(1).max(5),
      })
    )
    .min(1, "최소 한 개 카테고리는 평가해야 합니다.")
    .max(CATEGORY_VALUES.length)
    .refine(
      (arr) => new Set(arr.map((r) => r.category)).size === arr.length,
      "같은 카테고리를 두 번 보낼 수 없습니다."
    ),
  isAnonymous: z.boolean().optional(),
  comment: z
    .string()
    .trim()
    .max(500, "한줄평은 500자까지 쓸 수 있습니다.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const REVIEW_COMMENT_MAX = 500;
/* Footer: lib/validation.ts */
