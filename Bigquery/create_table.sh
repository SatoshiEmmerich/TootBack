cat <<EOL > ./schema_toots_load.json
[
  {
    "name": "instance",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "id",
    "type": "INT64",
    "mode": "REQUIRED"
  },
  {
    "name": "created_at",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "content",
    "type": "STRING",
    "mode": "NULLABLE"
  },
  {
    "name": "status_json",
    "type": "STRING",
    "mode": "REQUIRED"
  }
]
EOL
cat <<EOL > ./schema_toots_bigram.json
[
  {
    "name": "instance",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "id",
    "type": "INT64",
    "mode": "REQUIRED"
  },
  {
    "name": "created_at",
    "type": "TIMESTAMP",
    "mode": "REQUIRED"
  },
  {
    "name": "words",
    "type": "STRING",
    "mode": "REPEATED"
  },
  {
    "name": "status_json",
    "type": "STRING",
    "mode": "REQUIRED"
  }
]
EOL

bq mk \
--table \
--description="バッチからのトゥートの読み込み先" \
--time_partitioning_type=HOUR \
--time_partitioning_field=created_at \
--time_partitioning_expiration=3600 \
--require_partition_filter=true \
tbds.toots_load ./schema_toots_load.json

bq mk \
--table \
--description="トゥートのbi-gram" \
--time_partitioning_type=HOUR \
--time_partitioning_field=created_at \
--time_partitioning_expiration=86400 \
--require_partition_filter=true \
tbds.toots_bigram ./schema_toots_bigram.json
