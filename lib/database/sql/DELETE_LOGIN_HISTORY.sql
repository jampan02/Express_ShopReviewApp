delete from
	t_login_history
where
	user_id = ?
	and login <= (
		select
			login
		from
			(
				select
					login
				from
					t_login_history
				where
					user_id = ?
				order by
					login desc
				limit
					1 offset ?
			) as tmp
	)