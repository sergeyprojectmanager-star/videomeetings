import { Button, Card } from '@heroui/react';

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>Video meetings</Card.Title>
          <Card.Description>
            HeroUI v3 is set up. Start building the UI from here.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="flex gap-3">
          <Button>Get started</Button>
          <Button variant="secondary">Learn more</Button>
        </Card.Footer>
      </Card>
    </main>
  );
}
