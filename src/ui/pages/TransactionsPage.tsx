import { MonthSwitcher } from '../components/MonthSwitcher';
import { Page, PageTitle } from '../components/Page';
import { copy } from '../copy';

export function TransactionsPage() {
  return (
    <Page>
      <PageTitle>{copy.nav.transactions}</PageTitle>
      <MonthSwitcher />
    </Page>
  );
}
