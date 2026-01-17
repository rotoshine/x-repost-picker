import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'neutral' | 'warning' | 'error';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 커스텀 가로 패딩 (px) */
  paddingX?: number;
  /** 커스텀 세로 패딩 (px) */
  paddingY?: number;
  /** 커스텀 폰트 크기 (px) */
  fontSize?: number;
  /** 커스텀 min-height (px) */
  minHeight?: number;
  /** 전체 너비 */
  fullWidth?: boolean;
  /** 정사각형 버튼 */
  square?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
}

const sizeStyles: Record<ButtonSize, { paddingX: number; paddingY: number; fontSize: number; squareSize: number }> = {
  xs: { paddingX: 12, paddingY: 6, fontSize: 12, squareSize: 28 },
  sm: { paddingX: 16, paddingY: 8, fontSize: 14, squareSize: 32 },
  md: { paddingX: 24, paddingY: 10, fontSize: 16, squareSize: 40 },
  lg: { paddingX: 32, paddingY: 14, fontSize: 18, squareSize: 48 },
  xl: { paddingX: 40, paddingY: 18, fontSize: 20, squareSize: 56 },
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-content hover:bg-primary/80',
  secondary: 'bg-secondary text-secondary-content hover:bg-secondary/80',
  ghost: 'bg-transparent hover:bg-base-300 text-base-content',
  neutral: 'bg-neutral text-neutral-content hover:bg-neutral/80',
  warning: 'bg-warning text-warning-content hover:bg-warning/80',
  error: 'bg-error text-error-content hover:bg-error/80',
};

function Button({
  children,
  variant = 'primary',
  size = 'md',
  paddingX,
  paddingY,
  fontSize,
  minHeight,
  fullWidth = false,
  square = false,
  loading = false,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const sizeStyle = sizeStyles[size];

  const finalPaddingX = square ? 0 : (paddingX ?? sizeStyle.paddingX);
  const finalPaddingY = square ? 0 : (paddingY ?? sizeStyle.paddingY);
  const finalFontSize = fontSize ?? sizeStyle.fontSize;

  const baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-lg',
    'transition-all duration-200 ease-out',
    'hover:scale-105 hover:shadow-lg',
    'active:scale-95',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none',
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  const buttonStyle: React.CSSProperties = {
    paddingLeft: `${finalPaddingX}px`,
    paddingRight: `${finalPaddingX}px`,
    paddingTop: `${finalPaddingY}px`,
    paddingBottom: `${finalPaddingY}px`,
    fontSize: `${finalFontSize}px`,
    ...(square && { width: `${sizeStyle.squareSize}px`, height: `${sizeStyle.squareSize}px` }),
    ...(minHeight && { minHeight: `${minHeight}px` }),
    ...style,
  };

  return (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      style={buttonStyle}
      {...props}
    >
      {loading ? (
        <>
          <span className="loading loading-spinner loading-sm" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
