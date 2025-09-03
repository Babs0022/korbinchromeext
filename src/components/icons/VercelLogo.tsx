import type { SVGProps } from 'react';

export function VercelLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 2L2 19.7778H22L12 2Z" fill="currentColor" />
    </svg>
  );
}
