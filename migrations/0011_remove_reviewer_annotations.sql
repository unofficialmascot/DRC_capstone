UPDATE applications
SET details = details - 'reviewerAnnotations'
WHERE details IS NOT NULL
  AND jsonb_typeof(details) = 'object'
  AND details ? 'reviewerAnnotations';
