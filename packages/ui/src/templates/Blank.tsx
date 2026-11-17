import { Heading } from '#components/atoms/Heading';
import { Layout } from '#components/atoms/Layout';

/* The empty page frame to start from. */
export function Blank() {
  return (
    <Layout>
      <Heading level={1}>New page</Heading>
    </Layout>
  );
}
