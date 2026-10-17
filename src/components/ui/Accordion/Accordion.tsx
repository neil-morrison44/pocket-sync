import { ReactNode } from "react"

import * as RadixAccordion from "@radix-ui/react-accordion"
import clsx from "clsx"

import Icon from "../Icon"

import "./Accordion.css"

export type AccordionProps =
  | RadixAccordion.AccordionSingleProps
  | RadixAccordion.AccordionMultipleProps

/** A list of rows that each expand to their content, e.g. release notes. */
const Accordion = ({ className, ...props }: AccordionProps) => (
  <RadixAccordion.Root {...props} className={clsx("accordion", className)} />
)

export interface AccordionItemProps {
  value: string
  /** The row's title, e.g. a version. */
  title: ReactNode
  /** Secondary info after the title, e.g. a date. */
  meta?: ReactNode
  /** Shown after the meta, e.g. tags. */
  aside?: ReactNode
  /**
   * A control in the header row, outside the toggle (a button can't sit
   * inside another button), e.g. an install button.
   */
  action?: ReactNode
  children: ReactNode
  id?: string
  className?: string
}

/** One row: a header that toggles its content. */
export const AccordionItem = ({
  value,
  title,
  meta,
  aside,
  action,
  children,
  id,
  className,
}: AccordionItemProps) => (
  <RadixAccordion.Item
    value={value}
    id={id}
    className={clsx("accordion__item", className)}
  >
    <RadixAccordion.Header className="accordion__header">
      <RadixAccordion.Trigger className="accordion__trigger">
        <span className="accordion__title">{title}</span>
        {meta && <span className="accordion__meta">{meta}</span>}
        {aside}
        <Icon icon="chevron-down" className="accordion__chevron" />
      </RadixAccordion.Trigger>
      {action && <div className="accordion__action">{action}</div>}
    </RadixAccordion.Header>
    <RadixAccordion.Content className="accordion__content">
      {children}
    </RadixAccordion.Content>
  </RadixAccordion.Item>
)

export default Accordion
