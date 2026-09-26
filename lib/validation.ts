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
    .min(1, "한 가지 이상은 평가해 주세요.")
    .max(CATEGORY_VALUES.length)
    .refine(
      (arr) => new Set(arr.map((r) => r.category)).size === arr.length,
      "같은 항목을 두 번 보낼 수 없어요."
    ),
  isAnonymous: z.boolean().optional(),
  comment: z
    .string()
    .trim()
    .max(500, "한줄평은 500자까지 쓸 수 있어요.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const REVIEW_COMMENT_MAX = 500;

// --- 도구 후기 --------------------------------------------------------------

export const TOOL_AXIS_VALUES = ["EASE", "OUTPUT", "PRICE", "KOREAN"] as const;

/**
 * 모델 리뷰 스키마를 재사용하지 않고 따로 둔다.
 * 축 enum이 다르기 때문이다 — 하나로 합치면 CODING 점수가 도구 후기로,
 * EASE 점수가 모델 리뷰로 들어가는 걸 타입이 막아주지 못한다.
 */
export const toolReviewInputSchema = z.object({
  ratings: z
    .array(
      z.object({
        axis: z.enum(TOOL_AXIS_VALUES),
        score: z.number().int().min(1).max(5),
      })
    )
    .min(1, "한 가지 이상은 평가해 주세요.")
    .max(TOOL_AXIS_VALUES.length)
    .refine(
      (arr) => new Set(arr.map((r) => r.axis)).size === arr.length,
      "같은 항목을 두 번 보낼 수 없어요."
    ),
  isAnonymous: z.boolean().optional(),
  comment: z
    .string()
    .trim()
    .max(500, "한줄평은 500자까지 쓸 수 있어요.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ToolReviewInput = z.infer<typeof toolReviewInputSchema>;
/* Footer: lib/validation.ts */
