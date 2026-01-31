const iconAvailList = Object.fromEntries(
  Object.entries(
    import.meta.glob('@/assets/icons/**/*.svg', {
      import: 'default',
      query: '?raw',
      eager: true,
    }),
  )
    .map(([path, icon]): [string, boolean] => {
      const match = path.match(/.+?icons\/(.+?)\.svg/i);
      const name = match?.[1];

      if (!name || !icon) {
        return ['', false];
      }

      return [name, true];
    })
    .filter(([path, exist]) => !!path && exist),
);

const icons = Object.keys(iconAvailList);

function isIconExist(path: string | null | undefined): path is string {
  return !!path && Boolean(iconAvailList[path]);
}

function getIconName(path: string) {
  if (isIconExist(path)) {
    const name = path.replace(/\//g, '-');

    return `#ttg-${name}`;
  }

  console.error(`[SvgIcon]: icon "${String(path)}" not found.`);

  return undefined;
}

export { getIconName, iconAvailList, icons, isIconExist };
