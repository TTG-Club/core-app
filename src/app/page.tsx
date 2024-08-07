import Link from 'next/link';

export default function Home() {
  return (
    <div
      className=""
      key="home-page"
    >
      Home page
      <Link href="/classes">Go to Class</Link>
    </div>
  );
}
