import { Flex } from 'antd';
import React from 'react';

export default function Layout({
  children,
  detail,
}: Readonly<{
  children: React.ReactNode;
  detail: React.ReactNode;
}>) {
  return (
    <Flex>
      {children}

      <div className="class-detail">{detail}</div>
    </Flex>
  );
}
