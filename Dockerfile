FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    sudo \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g opencode-ai

RUN useradd -m -s /bin/bash developer && usermod -a -G sudo developer
RUN echo "developer ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

USER developer
WORKDIR /workspace

COPY --chown=developer:developer . .

ENTRYPOINT ["opencode"]