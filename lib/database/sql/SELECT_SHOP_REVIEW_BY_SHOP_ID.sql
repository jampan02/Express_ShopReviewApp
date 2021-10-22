select
	t_review.id,
	t_user.id as "user_id",
	t_user.name as "user_name",
	t_review.score,
	t_review.visit,
	t_review.post,
	t_review.description
from
	t_review
	left join t_user on t_review.user_id = t_user.id
where
	t_review.shop_id = ?