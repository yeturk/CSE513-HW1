import type { ReactElement } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

/** One stable trigger per control; the portal escapes chart/table overflow containers. */
export function ControlTooltip({ content, children, side = 'top' }: {
  content: string; children: ReactElement<{ disabled?: boolean }>; side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const trigger = children.props.disabled
    ? <span className="disabled-tooltip-trigger" tabIndex={0} aria-label={content}>{children}</span>
    : children;
  return <Tooltip.Root><Tooltip.Trigger asChild>{trigger}</Tooltip.Trigger><Tooltip.Portal>
    <Tooltip.Content className="control-tooltip" side={side} sideOffset={8} collisionPadding={12}>
      {content}<Tooltip.Arrow className="control-tooltip-arrow" />
    </Tooltip.Content>
  </Tooltip.Portal></Tooltip.Root>;
}

export function HelpTooltip({ label, content }: { label: string; content: string }) {
  return <ControlTooltip content={content}><button type="button" className="help-tooltip-trigger" aria-label={label}>?</button></ControlTooltip>;
}
