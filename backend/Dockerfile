FROM rust:1.82-bookworm AS builder

WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim

RUN useradd --system --user-group app
WORKDIR /app
COPY --from=builder /app/target/release/horse-farm-backend /usr/local/bin/horse-farm-backend
USER app

EXPOSE 3001
CMD ["horse-farm-backend"]
