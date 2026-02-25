# mcp-notion

Search, read, and create pages and databases in Notion workspaces.

## Tools

| Tool | Description |
|------|-------------|
| `search` | Search pages and databases in Notion. |
| `get_page` | Get a Notion page and its properties. |
| `get_page_content` | Get the block content of a page. |
| `query_database` | Query a Notion database. |
| `create_page` | Create a new page in a database or as child of a page. |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NOTION_API_KEY` | Yes | Notion internal integration token |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-notion.git
cd mcp-notion
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "notion": {
      "command": "node",
      "args": ["/path/to/mcp-notion/dist/index.js"],
      "env": {
        "NOTION_API_KEY": "your-notion-api-key"
      }
    }
  }
}
```

## Usage with npx

```bash
npx mcp-notion
```

## License

MIT
