update
	t_shop
set
	score = (
		select
			round(avg(score), 2)
		from
			t_review
		where
			shop_id = ?
	)
where
	id = ?