FROM heroiclabs/nakama:3.15.0

COPY ./modules /nakama/data/modules

CMD ["sh", "-c", "nakama \
  --name nakama1 \
  --database.address $(echo $DATABASE_URL | sed 's/postgresql:\\/\\///') \
  --socket.port $PORT"]