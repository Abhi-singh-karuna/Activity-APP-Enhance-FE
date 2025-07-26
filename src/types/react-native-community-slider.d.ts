declare module "@react-native-community/slider" {
  import { Component } from "react";
  import { StyleProp, ViewStyle } from "react-native";

  export interface SliderProps {
    /**
     * Set to true to use the default 'track' color.
     */
    disabled?: boolean;

    /**
     * The color used for the track to the left of the button.
     */
    minimumTrackTintColor?: string;

    /**
     * The color used for the track to the right of the button.
     */
    maximumTrackTintColor?: string;

    /**
     * The color used for the thumb.
     */
    thumbTintColor?: string;

    /**
     * The size of the touch area that allows moving the thumb.
     * The touch area has the same center as the visible thumb.
     * This allows to have a visually small thumb while still allowing the user
     * to move it easily.
     */
    thumbTouchSize?: { width: number; height: number };

    /**
     * Initial value of the slider. The value should be between minimumValue
     * and maximumValue, which default to 0 and 1 respectively.
     * Default value is 0.
     *
     * This is not a controlled component, e.g. if you don't update
     * the value, the component won't be reset to its inital value.
     */
    value?: number;

    /**
     * Step value of the slider. The value should be
     * between 0 and (maximumValue - minimumValue).
     * Default value is 0.
     */
    step?: number;

    /**
     * Minimum value of the slider. Default value is 0.
     */
    minimumValue?: number;

    /**
     * Maximum value of the slider. Default value is 1.
     */
    maximumValue?: number;

    /**
     * Callback continuously called while the user is dragging the slider.
     */
    onValueChange?: (value: number) => void;

    /**
     * Callback called when the user starts changing the value (e.g. when
     * the slider is pressed).
     */
    onSlidingStart?: (value: number) => void;

    /**
     * Callback called when the user finishes changing the value (e.g. when
     * the slider is released).
     */
    onSlidingComplete?: (value: number) => void;

    /**
     * Used to locate this view in end-to-end tests.
     */
    testID?: string;

    /**
     * The style applied to the slider container.
     */
    style?: StyleProp<ViewStyle>;

    /**
     * If true the user won't be able to move the slider.
     * Default value is false.
     */
    disabled?: boolean;

    /**
     * Assigns a single image resource as the slider thumb.
     */
    thumbImage?: any;

    /**
     * A string of one or more words to be announced by the screen reader.
     * Otherwise, it will announce the value as a percentage.
     */
    accessibilityLabel?: string;
  }

  export default class Slider extends Component<SliderProps> {}
}
