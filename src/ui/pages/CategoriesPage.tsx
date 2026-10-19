import { MonthSwitcher } from '../components/MonthSwitcher';
import { Page, PageTitle } from '../components/Page';
import { copy } from '../copy';

export function CategoriesPage() {
  return (
    <Page>
      <PageTitle>{copy.nav.categories}</PageTitle>
      <MonthSwitcher />
    </Page>
  );
}
