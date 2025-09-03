import type { SVGProps } from 'react';

export function ReplitLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M13.5 6H18V10.5H13.5V6Z" fill="#F26202" />
      <path d="M6 13.5H10.5V18H6V13.5Z" fill="#F26202" />
      <path d="M6 6H10.5V10.5H6V6Z" fill="#F26202" />
    </svg>
  );
}
