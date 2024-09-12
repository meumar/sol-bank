import { SVGProps } from "react";

/*global SVGSVGElement */

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};


export interface UserInterface{
  name: string,
  skills: string[]
}
