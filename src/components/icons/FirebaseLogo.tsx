import type { SVGProps } from 'react';

export function FirebaseLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.96101 19.822L12.502 3.49901L18.43 14.708L14.469 20.354L5.96101 19.822Z"
        fill="#FFCA28"
      />
      <path d="M12.502 3.49902L5.96101 19.822L2.57101 17.026L12.502 3.49902Z" fill="#FFA000" />
      <path d="M18.43 14.7081L12.5 3.5L14.731 2.52906L18.43 14.7081Z" fill="#F57F17" />
    </svg>
  );
}
