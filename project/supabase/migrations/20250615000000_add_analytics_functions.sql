CREATE OR REPLACE FUNCTION get_spoilage_overview(p_user_id uuid)
RETURNS TABLE(category text, count bigint, percentage numeric) AS $$
BEGIN
  RETURN QUERY
  WITH batch_spoilage_dates AS (
    SELECT
      id,
      dynamic_spoilage_date,
      (dynamic_spoilage_date - now()) AS time_to_spoil
    FROM flower_batches
    WHERE user_id = p_user_id AND dynamic_spoilage_date > now()
  ),
  categorized_batches AS (
    SELECT
      id,
      CASE
        WHEN time_to_spoil < '1 day'::interval THEN 'Critical (< 24 hours)'
        WHEN time_to_spoil >= '1 day'::interval AND time_to_spoil < '3 days'::interval THEN 'Urgent (1-3 days)'
        WHEN time_to_spoil >= '3 days'::interval AND time_to_spoil < '7 days'::interval THEN 'Warning (3-7 days)'
        ELSE 'Good (> 7 days)'
      END AS spoilage_category
    FROM batch_spoilage_dates
  ),
  total_active_batches AS (
    SELECT count(*) AS total FROM flower_batches WHERE user_id = p_user_id AND dynamic_spoilage_date > now()
  )
  SELECT
    s.spoilage_category,
    count(s.id) AS count,
    (count(s.id)::numeric / total.total::numeric) * 100 AS percentage
  FROM categorized_batches s, total_active_batches total
  GROUP BY s.spoilage_category, total.total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_spoilage_risk_by_category(p_user_id uuid, category_type text)
RETURNS TABLE(category_value text, spoiled_count bigint) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT
      %I AS category_value,
      COUNT(*) AS spoiled_count
    FROM flower_batches
    WHERE user_id = %L AND dynamic_spoilage_date <= now()
    GROUP BY %I
    ORDER BY spoiled_count DESC
    LIMIT 10;',
    category_type, p_user_id, category_type
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_predicted_waste_trend(p_user_id uuid, start_date date, end_date date)
RETURNS TABLE(trend_date date, total_quantity numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('week', dynamic_spoilage_date)::date AS trend_date,
    SUM(quantity)::numeric AS total_quantity
  FROM flower_batches
  WHERE user_id = p_user_id
    AND dynamic_spoilage_date BETWEEN start_date AND end_date
  GROUP BY trend_date
  ORDER BY trend_date;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_discount_candidates(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  flower_type text,
  variety text,
  quantity integer,
  dynamic_spoilage_date timestamptz,
  ai_recommendations text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fb.id,
    fb.flower_type,
    fb.variety,
    fb.quantity,
    fb.dynamic_spoilage_date,
    fb.ai_recommendations
  FROM flower_batches fb
  WHERE
    fb.user_id = p_user_id
    AND fb.dynamic_spoilage_date BETWEEN now() AND now() + interval '3 days'
    AND array_to_string(fb.ai_recommendations, ',') ILIKE '%discount%'
  ORDER BY fb.dynamic_spoilage_date ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_potential_savings(p_user_id uuid, assumed_price_per_stem numeric)
RETURNS TABLE(potential_savings numeric) AS $$
BEGIN
  -- This is a simplified simulation.
  -- Assumes a 50% discount on items that are candidates for discounting.
  -- A more complex version could use historical sales data.
  RETURN QUERY
  SELECT
    SUM(dc.quantity * assumed_price_per_stem * 0.5) AS potential_savings
  FROM get_discount_candidates(p_user_id) dc;
END;
$$ LANGUAGE plpgsql; 