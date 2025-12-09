# GENIE (Graph Enabled Next Intelligent Environment)

**GENIE** is a modern, full-stack template designed for building AI agents using **LangGraph.js** on the frontend and **Model Context Protocol (MCP)** on the backend. It combines a high-performance Next.js 15 client with a flexible Python server, offering a robust foundation for intelligent applications.

## 📂 Project Structure

The project is divided into two main components:

- **`genie_client/`**: The frontend application built with Next.js, featuring LangGraph for agent and workflow orchestration.
- **`genie_server/`**: The backend server powered by Python and FastMCP, providing tools and data access (including MongoDB integration).

## 🚀 Getting Started

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
