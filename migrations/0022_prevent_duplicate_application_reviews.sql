WITH ranked_reviews AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY application_id, reviewer_id, stage
      ORDER BY review_date DESC NULLS LAST, id DESC
    ) AS review_rank
  FROM application_reviews
)
DELETE FROM application_reviews
WHERE id IN (
  SELECT id
  FROM ranked_reviews
  WHERE review_rank > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS application_reviews_application_reviewer_stage_idx
  ON application_reviews (application_id, reviewer_id, stage);