import { Page, PageTitle } from '../components/Page';
import { copy } from '../copy';

export function SettingsPage() {
  return (
    <Page>
      <PageTitle>{copy.nav.settings}</PageTitle>
    </Page>
  );
}
