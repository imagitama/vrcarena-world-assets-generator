CREATE OR REPLACE VIEW getAssetsForVrchatWorld WITH (security_barrier) AS
	SELECT 
		assets.id,
		title,
		assets.thumbnailurl,
		category,
		species,
        vrchatclonableavatarids,
		-- author
		authors.id AS author,
		authors.name AS authorName
	FROM assets
    LEFT JOIN assetMeta ON assetMeta.id = assets.id
    LEFT JOIN authors ON authors.id = assets.author
	WHERE
		publishstatus = 'published' AND
		accessstatus = 'public' AND
		approvalstatus = 'approved' AND
        isadult != TRUE
    GROUP BY
        assets.id,
        authors.id;