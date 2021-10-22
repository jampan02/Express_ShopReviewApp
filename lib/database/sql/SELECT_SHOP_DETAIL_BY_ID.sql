select
	shop_category.id,
	shop_category.name,
	shop_category.post_code,
	shop_category.address,
	shop_category.tel,
	shop_category.holiday,
	shop_category.seats,
	shop_category.price_range,
	shop_category.score,
	shop_category.geolocation_longitude,
	shop_category.geolocation_longitude,
	group_concat(m_category.name separator ",") as categories
from
	(
		select
			*
		from
			(
				select
					*
				from
					t_shop
				where
					id = ?
			) as shop
			left join t_shop_category on shop.id = t_shop_category.shop_id
	) as shop_category
	left join m_category on shop_category.category_id = m_category.id
group by
	shop_category.id