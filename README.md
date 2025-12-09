# GENIE (Graph Enabled Next Intelligent Environment)

**GENIE** is a modern, full-stack template designed for building AI agents using **LangGraph.js** on the frontend and **Model Context Protocol (MCP)** on the backend. It combines a high-performance Next.js 15 client with a flexible Python server, offering a robust foundation for intelligent applications.

## 📂 Project Structure

The project is divided into two main components:

- **`genie_client/`**: The frontend application built with Next.js, featuring LangGraph for agent and workflow orchestration.
- **`genie_server/`**: The backend server powered by Python and FastMCP, providing tools and data access (including MongoDB integration).

## ✨ Key Features

### 🔐 Authentication

Secure user authentication is implemented using **NextAuth.js**, supporting multiple providers:

- **Google OAuth**: Easy login with Google accounts.
- **Azure AD**: Enterprise-grade authentication.
- **Customizable**: additional providers can be added in `app/api/auth/[...nextauth]/route.ts`.

### 🔌 Model Context Protocol (MCP) Integration

The project fully embraces the **Model Context Protocol** for standardized tool usage:

- **FastMCP Server**: The `genie_server` runs a FastMCP instance (`server.py`) exposing tools like `calculate_metrics`, `analyze_sentiment_keyword`, and database access.
- **Tool Selection**: The frontend (LangGraph agent) dynamically discovers and selects these MCP tools to fulfill user requests, enabling a decoupled and extensible architecture.

### 📝 Prompt Management

- **Save & Reuse**: Users can save their current chat context or specific instructions as reusable prompts.
- **Database Storage**: Prompts are stored in the database for easy retrieval and management via the `PromptSaveDialog`.

### 🤖 Multi-Agent & Custom Agent Chat

- **Supervisor Pattern**: Uses `langgraph-supervisor` to orchestrate a team of specialized sub-agents.
- **Custom Agents**: Users can define and configure custom sub-agents with specific system prompts, models, and allowed tools.
- **Intelligent Routing**: The supervisor agent analyzes user queries and routes them to the most appropriate sub-agent(s) for handling.

### 📄 Document & Image Analysis

- **File Uploads**: Supports uploading various file types via the `api/upload` endpoint.
- **Image Analysis**: Images are processed (base64 encoded) and passed to vision-capable models for analysis.
- **Document Parsing**: Text is extracted from documents (PDF, DOCX, etc.) to provide context for the AI agents.

## � Screenshots

![Screenshot 1](./screenshots/image-1.png)
![Screenshot 2](./screenshots/image-2.png)
![Screenshot 3](./screenshots/image-3.png)
![Screenshot 4](./screenshots/image-4.png)
![Screenshot 5](./screenshots/image-5.png)
![Screenshot 6](./screenshots/image-6.png)
![Screenshot 7](./screenshots/image-7.png)
![Screenshot 8](./screenshots/image-8.png)
![Screenshot 9](./screenshots/image-9.png)
![Screenshot 10](./screenshots/image-10.png)
![Screenshot 11](./screenshots/image-11.png)

## �🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **pnpm** (Package manager)
- **Python** (v3.10+)
- **MongoDB** (Running locally on default port `27017`)

---

### 🐍 Backend Setup (genie_server)

1.  Navigate to the server directory:

    ```bash
    cd genie_server
    ```

2.  Create and activate a virtual environment:

    ```bash
    # Windows
    python -m venv .venv
    .venv\Scripts\activate

    # macOS/Linux
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4.  Start the MCP server:
    ```bash
    python server.py
    ```
    _The server acts as a streamable MCP server (HTTP/SSE)._

---

### ⚛️ Frontend Setup (genie_client)

1.  Navigate to the client directory:

    ```bash
    cd genie_client
    ```

2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Set up environment variables:

    - Duplicate `.env.example` to `.env`.
    - Configure your API keys (Google GenAI, OpenAI, etc.) as needed.

4.  Run the development server:

    ```bash
    pnpm dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 🔌 MCP Configuration

To connect the frontend to the backend MCP server:

1.  Open the application at `http://localhost:3000`.
2.  Click the **settings icon** and "Configure MCP" in the header to open the MCP Server list.
3.  Click **"Add Server"** and enter the following details:
    - **Name**: `Genie Server` (or any name you prefer)
    - **Type**: `http`
    - **URL**: `http://localhost:8000/mcp`
4.  Click **"Save"**. The client will now be able to discover and use the tools defined in `genie_server/server.py`.

> [!NOTE]
> The tools currently implemented in `genie_server/server.py` (e.g., `calculate_metrics`, `analyze_sentiment_keyword`, `get_stock_price`) are **examples** to demonstrate MCP integration. You should replace them with your own actual business logic or integrations.

## 🛠️ Tech Stack

### Client

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **AI Orchestration**: [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) & [LangChain](https://js.langchain.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)

### Server

- **Core**: Python
- **Protocol**: [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) via `FastMCP`
- **Database**: [MongoDB](https://www.mongodb.com/) (via `pymongo`)

## � Acknowledgements

Special thanks to the following projects for their base code and inspiration:

- [LangChain UI](https://docs.langchain.com/oss/python/langchain/ui)
- [Fullstack LangGraph Next.js Agent](https://github.com/IBJunior/fullstack-langgraph-nextjs-agent)
