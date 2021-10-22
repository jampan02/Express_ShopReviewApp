select
	count(*) as count
from
	t_login_history
where
	user_id = ?
	and login >= ?
	and status = ?