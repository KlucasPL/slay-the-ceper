FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    sudo \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g opencode-ai

RUN useradd -m -s /bin/bash developer && usermod -a -G sudo developer
RUN echo "developer ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

USER developer
WORKDIR /workspace

# Install VS Code server for remote development
RUN curl -fsSL https://code.visualstudio.com/sha/download?os=linux-x64 | tar -xz -C /tmp && \
    mv /tmp/VSCode-linux-x64 /home/developer/vscode-server && \
    ln -s /home/developer/vscode-server/bin/code-server /usr/local/bin/code-server

COPY --chown=developer:developer . .

RUN npm install --ignore-scripts && npm install @rollup/rollup-linux-x64

ENTRYPOINT ["opencode"]