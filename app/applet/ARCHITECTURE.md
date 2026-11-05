# SalesPulse - Regional Revenue & AI Shift Intelligence Architecture

SalesPulse is an advanced business intelligence and financial analytics platform designed to help executives, sales leaders, and analysts upload, explore, and evaluate regional sales order data across quarters. The application automatically computes revenue totals, growth rates, discounting trends, and product/channel performance drivers, while leveraging Google's Gemini AI to deliver strictly grounded, three-sentence executive commentaries highlighting key quarterly shifts between Q2 and Q3.

| File Path | Description |
| --- | --- |
| `.gitignore` | Specifies intentionally untracked files that git should ignore. |
| `index.html` | The main HTML entry point containing metadata, OpenGraph tags, and page title. |
| `metadata.json` | Application metadata defining name, description, and server-side Gemini capability permissions. |
| `package.json` | Defines project dependencies, scripts, and configuration for Node.js and Vite. |
| `server.ts` | Express backend server handling API requests, Vite middleware integration, and Gemini 3.8 Flash AI summary generation. |
| `tsconfig.json` | TypeScript compiler options and module resolution rules. |
| `vite.config.ts` | Vite build tool configuration for bundling and development server hosting. |
| `bun.lock` | Lock file for package dependency versions. |
| `src/App.tsx` | Main React application component coordinating state, data processing, and layout views. |
| `src/index.css` | Global stylesheet importing Tailwind CSS v4 directives. |
| `src/main.tsx` | React DOM entry point mounting the root App component. |
| `src/components/AISummaryCard.tsx` | UI component displaying the AI-generated three-sentence quarterly variance summary and model status. |
| `src/components/DataUploader.tsx` | UI component for uploading, previewing, and validating custom CSV sales order datasets. |
| `src/components/KPICards.tsx` | UI component rendering key performance indicator summary cards for total revenue, growth, and top regions. |
| `src/components/Navbar.tsx` | Navigation bar component featuring branding, file status, preset selection, and upload triggers. |
| `src/components/OrdersDrawer.tsx` | Sliding drawer component displaying filterable raw sales order records. |
| `src/components/RevenueChart.tsx` | Interactive chart component visualizing quarterly regional revenue trends. |
| `src/components/RevenueTable.tsx` | Pivot table component breaking down revenue by region, product, channel, and quarter. |
| `src/types/sales.ts` | TypeScript interface definitions for sales records, analytics metrics, and AI summary states. |
| `src/utils/analytics.ts` | Business logic and analytics engine calculating revenue shifts, growth percentages, and prompt payloads for AI. |
| `src/utils/csvParser.ts` | Utility for parsing, validating, and sanitizing uploaded CSV sales order files. |
| `src/utils/sampleData.ts` | Provides preset sample datasets for quick exploration and demonstration. |
