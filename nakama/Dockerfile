FROM heroiclabs/nakama:3.15.0

COPY ./modules /nakama/data/modules

CMD ["sh", "-c", "nakama \
  --name nakama1 \
  --database.address postgres:BGGaWLqGytwmPwrhyFOQpgMhNIiQxjNa@containers-us-west-123.railway.app:5432/railway \
  --socket.port $PORT"]