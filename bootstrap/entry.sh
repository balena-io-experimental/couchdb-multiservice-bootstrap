#!/bin/sh

DATABASE=$COUCHDB_USER:$COUCHDB_PASSWORD@database.local:5984

# Wait for it to be up
for i in $(seq 20); do
  if curl -s http://$DATABASE >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl -X PUT "http://${DATABASE}/_users"

curl -X PUT http://$DATABASE/$COUCHDB_UPSTREAM_DBNAME

curl -X DELETE "http://${DATABASE}/_replicator"
curl -X PUT "http://${DATABASE}/_replicator"

 
curl -X POST "http://${DATABASE}/_replicator" \
-H 'Content-Type: application/json' \
--data-binary @- << EOF
{
    "_id": "${COUCHDB_UPSTREAM_DBNAME}_replica",
    "source": "http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/${COUCHDB_UPSTREAM_DBNAME}",
    "target": "http://$COUCHDB_USER:$COUCHDB_PASSWORD@192.168.0.193:5984/${COUCHDB_UPSTREAM_DBNAME}",
    "create_target": true,
    "continuous": true
}
EOF

curl -X POST "http://${DATABASE}/_replicator" \
-H 'Content-Type: application/json' \
--data-binary @- << EOF
{
    "_id": "${COUCHDB_DOWNSTREAM_DBNAME}_replica",
    "source": "http://$COUCHDB_USER:$COUCHDB_PASSWORD@192.168.0.193:5984/${COUCHDB_DOWNSTREAM_DBNAME}",
    "target": "http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/${COUCHDB_DOWNSTREAM_DBNAME}",
    "create_target": true,
    "continuous": true
}
EOF
