/**
 * Legacy alias barrel — canonical pages live in `src/pages/Branch/`.
 * Router and lazy imports should prefer Branch paths; these re-exports avoid breaking older imports.
 */
export { BranchesPage, BranchesPage as ResortsPage } from '../Branch/BranchesPage.jsx';
export { BranchDetailPage, BranchDetailPage as ResortDetailPage } from '../Branch/BranchDetailPage.jsx';
