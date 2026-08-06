import { createContext, useContext } from "react";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { cx } from "@/utils/cx";

const RadioGroupContext = createContext(null);

export const RadioButtonBase = ({ className, isFocusVisible, isSelected, isDisabled, size = "sm" }) => {
    return (
        <div
            className={cx(
                "flex size-4 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-full bg-primary ring-1 ring-primary ring-inset",
                size === "md" && "size-5",
                isSelected && "bg-brand-solid ring-brand-solid",
                isDisabled && "cursor-not-allowed opacity-50",
                isDisabled && !isSelected && "bg-tertiary",
                isFocusVisible && "outline-2 outline-offset-2 outline-focus-ring",
                className,
            )}
        >
            <div className={cx("size-1.5 rounded-full bg-fg-white opacity-0 transition-inherit-all", size === "md" && "size-2", isSelected && "opacity-100")} />
        </div>
    );
};
RadioButtonBase.displayName = "RadioButtonBase";

export const RadioButton = ({ label, hint, className, size = "sm", ...ariaRadioProps }) => {
    const context = useContext(RadioGroupContext);
    const resolvedSize = context?.size ?? size;

    const sizes = {
        sm: { root: "gap-2", textWrapper: "", label: "text-sm font-medium", hint: "text-sm" },
        md: { root: "gap-3", textWrapper: "gap-0.5", label: "text-md font-medium", hint: "text-md" },
    };

    return (
        <AriaRadio
            {...ariaRadioProps}
            className={(state) =>
                cx(
                    "relative flex items-start",
                    state.isDisabled && "cursor-not-allowed",
                    sizes[resolvedSize].root,
                    typeof className === "function" ? className(state) : className,
                )
            }
        >
            {({ isSelected, isDisabled, isFocusVisible }) => (
                <>
                    <RadioButtonBase
                        size={resolvedSize}
                        isSelected={isSelected}
                        isDisabled={isDisabled}
                        isFocusVisible={isFocusVisible}
                        className={label || hint ? "mt-0.5" : ""}
                    />
                    {(label || hint) && (
                        <div className={cx("inline-flex flex-col", sizes[resolvedSize].textWrapper)}>
                            {label && <p className={cx("text-secondary select-none", sizes[resolvedSize].label)}>{label}</p>}
                            {hint && (
                                <span className={cx("text-tertiary", sizes[resolvedSize].hint)} onClick={(event) => event.stopPropagation()}>
                                    {hint}
                                </span>
                            )}
                        </div>
                    )}
                </>
            )}
        </AriaRadio>
    );
};
RadioButton.displayName = "RadioButton";

export const RadioGroup = ({ children, className, size = "sm", ...props }) => {
    return (
        <RadioGroupContext.Provider value={{ size }}>
            <AriaRadioGroup {...props} className={cx("flex flex-col gap-4", className)}>
                {children}
            </AriaRadioGroup>
        </RadioGroupContext.Provider>
    );
};
