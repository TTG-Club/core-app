import { Flex } from 'antd';
import React from 'react';
import Link from "next/link";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Flex>
      <nav>
        <ul>
          <li><Link href={'/classes/ork'}>Go to ork</Link></li>
          <li><Link href={'/classes/elf'}>Go to elf</Link></li>
          <li><Link href={'/classes/dragon'}>Go to dragon</Link></li>
          <li><Link href={'/classes/dog'}>Go to dog</Link></li>
          <li><Link href={'/classes/cat'}>Go to cat</Link></li>
        </ul>
      </nav>
      {children}
    </Flex>
  );
}
