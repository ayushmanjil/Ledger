import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FieldProps {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs uppercase tracking-wide text-cream-50/60 font-medium">{label}</label>}
      {children}
      {error && <span className="text-xs text-red-300 font-medium">{error}</span>}
    </div>
  );
}

const baseStyle =
  'w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm text-cream-50 placeholder:text-cream-50/35 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] focus:border-gold-300/60 focus:ring-1 focus:ring-gold-300/30 focus:outline-none transition-all';

function renderChildrenText(children: ReactNode): string {
  if (children === null || children === undefined || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(renderChildrenText).join('');
  if (React.isValidElement(children)) return renderChildrenText((children.props as any).children);
  return String(children);
}

// Helper to extract <option> children
function parseOptions(children: ReactNode): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const props = child.props as any;
      if (child.type === 'option' || (typeof child.type === 'string' && child.type.toLowerCase() === 'option')) {
        const val = String(props.value !== undefined ? props.value : (props.children ? renderChildrenText(props.children) : ''));
        const lbl = props.children !== undefined ? renderChildrenText(props.children) : String(props.value ?? '');
        options.push({ value: val, label: lbl.trim() });
      }
    }
  });
  return options;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, defaultValue, onChange, disabled, placeholder, ...props }, ref) => {
    const internalSelectRef = useRef<HTMLSelectElement | null>(null);
    useImperativeHandle(ref, () => internalSelectRef.current!);

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

    const options = parseOptions(children);

    // Determine current value
    const [currentVal, setCurrentVal] = useState<string>(() => {
      if (value !== undefined) return String(value);
      if (defaultValue !== undefined) return String(defaultValue);
      return options[0]?.value ?? '';
    });

    useEffect(() => {
      if (value !== undefined) {
        setCurrentVal(String(value));
      } else if (internalSelectRef.current) {
        setCurrentVal(internalSelectRef.current.value);
      }
    }, [value, children]);

    const updateCoords = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const popoverHeight = Math.min(options.length * 36 + 16, 260);

        let top = rect.bottom + 6;
        if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
          top = rect.top - popoverHeight - 6;
        }

        setCoords({
          top,
          left: Math.max(12, Math.min(rect.left, window.innerWidth - rect.width - 12)),
          width: rect.width,
        });
      }
    };

    const handleToggle = () => {
      if (disabled) return;
      if (!open) {
        updateCoords();
      }
      setOpen((prev) => !prev);
    };

    // Close on click outside or resize/scroll
    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          const popoverEl = document.getElementById('custom-select-popover');
          if (popoverEl && !popoverEl.contains(e.target as Node)) {
            setOpen(false);
          }
        }
      };
      const handleScroll = () => updateCoords();
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }, [open]);

    const handleSelectOption = (optVal: string) => {
      setCurrentVal(optVal);
      setOpen(false);

      if (internalSelectRef.current) {
        internalSelectRef.current.value = optVal;
        const event = new Event('change', { bubbles: true });
        internalSelectRef.current.dispatchEvent(event);
      }

      if (onChange && internalSelectRef.current) {
        const syntheticEvent = {
          target: internalSelectRef.current,
          currentTarget: internalSelectRef.current,
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    const selectedOption = options.find((o) => o.value === currentVal) ?? options[0];

    return (
      <div className="relative w-full">
        {/* Hidden native select for react-hook-form & accessibility */}
        <select
          ref={internalSelectRef}
          value={currentVal}
          onChange={(e) => {
            setCurrentVal(e.target.value);
            onChange?.(e);
          }}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          {...props}
        >
          {children}
        </select>

        {/* Custom Dropdown Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            baseStyle,
            'flex items-center justify-between gap-2 text-left cursor-pointer select-none',
            open && 'border-gold-300/70 ring-1 ring-gold-300/40',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span className="truncate">{selectedOption?.label || placeholder || 'Select option'}</span>
          <ChevronDown
            size={16}
            className={cn('text-gold-300/80 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          />
        </button>

        {/* Floating Custom Leather Popover */}
        {createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                id="custom-select-popover"
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: coords.top,
                  left: coords.left,
                  minWidth: Math.max(coords.width, 160),
                  maxWidth: 'calc(100vw - 24px)',
                  zIndex: 99999,
                }}
                className="leather-surface p-1.5 overflow-hidden shadow-2xl rounded-2xl border border-gold-300/25 bg-[#1F1410]"
              >
                <div className="max-h-60 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
                  {options.map((opt) => {
                    const isSelected = opt.value === currentVal;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectOption(opt.value)}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                          isSelected
                            ? 'bg-gold-300/20 text-gold-300 font-semibold shadow-sm'
                            : 'text-cream-50/90 hover:bg-gold-300/15 hover:text-gold-300'
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check size={15} className="text-gold-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM DATE PICKER
// ─────────────────────────────────────────────────────────────────────────────
interface CustomDatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker = forwardRef<HTMLInputElement, CustomDatePickerProps>(
  ({ className, value, defaultValue, onChange, disabled, placeholder, title, ...props }, ref) => {
    const internalInputRef = useRef<HTMLInputElement | null>(null);
    useImperativeHandle(ref, () => internalInputRef.current!);

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const [currentVal, setCurrentVal] = useState<string>(() => {
      if (value !== undefined && value !== null) return String(value);
      if (defaultValue !== undefined && defaultValue !== null) return String(defaultValue);
      return '';
    });

    useEffect(() => {
      if (value !== undefined && value !== null) {
        setCurrentVal(String(value));
      } else if (internalInputRef.current && internalInputRef.current.value) {
        setCurrentVal(internalInputRef.current.value);
      }
    });

    // Calendar navigation state
    const [viewDate, setViewDate] = useState<Date>(() => {
      if (currentVal && !isNaN(Date.parse(currentVal))) {
        return new Date(currentVal);
      }
      return new Date();
    });

    const updateCoords = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const popoverWidth = 280;
        const popoverHeight = 320;
        const spaceBelow = window.innerHeight - rect.bottom;

        let top = rect.bottom + 6;
        if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
          top = rect.top - popoverHeight - 6;
        }

        let left = rect.left;
        if (left + popoverWidth > window.innerWidth - 12) {
          left = window.innerWidth - popoverWidth - 12;
        }
        left = Math.max(12, left);

        setCoords({ top, left });
      }
    };

    const handleToggle = () => {
      if (disabled) return;
      if (!open) {
        if (currentVal && !isNaN(Date.parse(currentVal))) {
          setViewDate(new Date(currentVal));
        }
        updateCoords();
      }
      setOpen((prev) => !prev);
    };

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          const popoverEl = document.getElementById('custom-date-popover');
          if (popoverEl && !popoverEl.contains(e.target as Node)) {
            setOpen(false);
          }
        }
      };
      const handleScroll = () => updateCoords();
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }, [open]);

    // Date math
    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    const monthDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startDay = new Date(viewYear, viewMonth, 1).getDay();

    const calendarCells: (string | null)[] = [];
    for (let i = 0; i < startDay; i++) calendarCells.push(null);
    for (let d = 1; d <= monthDays; d++) {
      const monthStr = String(viewMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      calendarCells.push(`${viewYear}-${monthStr}-${dayStr}`);
    }

    const handleSelectDate = (dateISO: string) => {
      setCurrentVal(dateISO);
      setOpen(false);

      if (internalInputRef.current) {
        internalInputRef.current.value = dateISO;
        const event = new Event('change', { bubbles: true });
        internalInputRef.current.dispatchEvent(event);
      }

      if (onChange && internalInputRef.current) {
        const syntheticEvent = {
          target: internalInputRef.current,
          currentTarget: internalInputRef.current,
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const prevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

    // Display format: YYYY-MM-DD or DD/MM/YYYY
    const displayValue = currentVal || placeholder || title || 'dd-mm-yyyy';

    return (
      <div className="relative w-full">
        {/* Hidden native date input */}
        <input
          ref={internalInputRef}
          type="date"
          value={currentVal}
          onChange={(e) => {
            setCurrentVal(e.target.value);
            onChange?.(e);
          }}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          {...props}
        />

        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          title={title}
          className={cn(
            baseStyle,
            'flex items-center justify-between gap-2 text-left cursor-pointer select-none',
            open && 'border-gold-300/70 ring-1 ring-gold-300/40',
            !currentVal && 'text-cream-50/40',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span className="truncate font-mono text-xs sm:text-sm">{displayValue}</span>
          <CalendarIcon size={15} className="text-gold-300/80 shrink-0" />
        </button>

        {/* Floating Custom Leather Calendar Popover */}
        {createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                id="custom-date-popover"
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: coords.top,
                  left: coords.left,
                  width: 280,
                  zIndex: 99999,
                }}
                className="leather-surface p-3.5 overflow-hidden shadow-2xl rounded-2xl border border-gold-300/25 bg-[#1F1410]"
              >
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg text-cream-50/70 hover:text-cream-50 hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold font-display text-cream-50">
                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg text-cream-50/70 hover:text-cream-50 hover:bg-white/10 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-cream-50/50">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="py-1">
                      {w}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((dateISO, idx) => {
                    if (!dateISO) return <div key={idx} />;
                    const isSelected = dateISO === currentVal;
                    const dayNum = Number(dateISO.slice(-2));
                    const isToday = dateISO === new Date().toISOString().slice(0, 10);

                    return (
                      <button
                        key={dateISO}
                        type="button"
                        onClick={() => handleSelectDate(dateISO)}
                        className={cn(
                          'h-8 w-full rounded-xl text-xs font-medium flex items-center justify-center transition-all cursor-pointer',
                          isSelected
                            ? 'bg-gold-300 text-leather-950 font-bold shadow-md'
                            : 'text-cream-50/90 hover:bg-gold-300/20 hover:text-gold-300',
                          isToday && !isSelected && 'border border-gold-300/60 font-semibold'
                        )}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  }
);
CustomDatePicker.displayName = 'CustomDatePicker';

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC INPUT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    if (type === 'date') {
      return <CustomDatePicker ref={ref} className={className} {...props} />;
    }

    if (type === 'password') {
      return (
        <div className="relative w-full">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn(baseStyle, 'pr-10', className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-50/50 hover:text-gold-300 focus:outline-none transition-colors p-1 rounded-lg cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      );
    }

    return <input ref={ref} type={type} className={cn(baseStyle, className)} {...props} />;
  }
);
Input.displayName = 'Input';
