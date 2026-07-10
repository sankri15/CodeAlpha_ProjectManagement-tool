# Implement Portfolios (Project Groups)

The user requested the ability to create "group projects", which in the context of this application maps directly to the **Portfolios** feature. A Portfolio is a collection or group of multiple projects that allows users to monitor their status together. 

## Proposed Changes

We will introduce a new core entity `Portfolio` to group projects.

### Backend Data Layer
#### [MODIFY] backend/src/db.ts
- Create `portfolios` table (`id`, `name`, `ownerId`, `createdAt`).
- Create `portfolio_projects` table (`portfolioId`, `projectId`) to establish a many-to-many relationship between portfolios and projects.

#### [NEW] backend/src/routes/portfolios.ts
- `GET /portfolios`: Fetch all portfolios for the user, including the aggregated stats (completion percentage, task counts) for the projects inside them.
- `POST /portfolios`: Create a new portfolio with a name and a list of project IDs.
- Update `backend/src/index.ts` to register the new `portfolios` route.

### Frontend UI Layer
#### [MODIFY] frontend/src/pages/Portfolios.tsx
- Wire up the `+ New Portfolio` button to open a `CreatePortfolioModal`.
- Restructure the view to list Portfolios. When a Portfolio is expanded or clicked, it will show the projects inside it, retaining the current beautiful card-based status UI for the nested projects.

#### [NEW] frontend/src/components/CreatePortfolioModal.tsx
- A modal form that allows the user to name their new Portfolio.
- A multi-select checklist of all existing projects so they can instantly group them into the new Portfolio.
- A "Save Portfolio" button.

## Verification Plan

### Manual Verification
- Click "+ New Portfolio".
- Create a portfolio named "Q3 Marketing Initiatives" and select a few existing projects to group into it.
- Verify that the Portfolio renders correctly on the page and accurately aggregates the health/status of the projects within it.
