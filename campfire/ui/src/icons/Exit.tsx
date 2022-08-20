import React from "react";

export const Exit = ({ className, primary, secondary }: IconProps) => (
  <svg
    width="25"
    height="24"
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      className={primary}
      d="M4.5 18H6.5V20H18.5V4H6.5V6H4.5V3C4.5 2.73478 4.60536 2.48043 4.79289 2.29289C4.98043 2.10536 5.23478 2 5.5 2H19.5C19.7652 2 20.0196 2.10536 20.2071 2.29289C20.3946 2.48043 20.5 2.73478 20.5 3V21C20.5 21.2652 20.3946 21.5196 20.2071 21.7071C20.0196 21.8946 19.7652 22 19.5 22H5.5C5.23478 22 4.98043 21.8946 4.79289 21.7071C4.60536 21.5196 4.5 21.2652 4.5 21V18ZM6.5 11H13.5V13H6.5V16L1.5 12L6.5 8V11Z"
    />
  </svg>
);
