import { Html5QrcodeScanner } from "html5-qrcode";
import React from 'react';

const qrcodeRegionId = "html5qr-code-full-region";

class Html5QrcodePlugin extends React.Component {
    render() {
        return <div id={qrcodeRegionId} />;
    }

    componentWillUnmount() {
        // TODO(mebjas): See if there is a better way to handle
        //  promise in `componentWillUnmount`.
        // @ts-ignore
        this.html5QrcodeScanner.clear().catch(error => {
            console.error("Failed to clear html5QrcodeScanner. ", error);
        });
    }

    componentDidMount() {
        // Creates the configuration object for Html5QrcodeScanner.
        function createConfig(props: any) {
            var config = {};
            if (props.fps) {
                // @ts-ignore
                config.fps = props.fps;
            }
            if (props.qrbox) {
                // @ts-ignore
                config.qrbox = props.qrbox;
            }
            if (props.aspectRatio) {
                // @ts-ignore
                config.aspectRatio = props.aspectRatio;
            }
            if (props.disableFlip !== undefined) {
                // @ts-ignore
                config.disableFlip = props.disableFlip;
            }
            return config;
        }

        var config = createConfig(this.props);
        // @ts-ignore
        var verbose = this.props.verbose === true;

        // Suceess callback is required.
        // @ts-ignore
        if (!(this.props.qrCodeSuccessCallback )) {
            throw "qrCodeSuccessCallback is required callback.";
        }

        // @ts-ignore
        // @ts-ignore
        this.html5QrcodeScanner = new Html5QrcodeScanner(
            // @ts-ignore
            qrcodeRegionId, config, verbose);
        // @ts-ignore
        this.html5QrcodeScanner.render(
            // @ts-ignore
            this.props.qrCodeSuccessCallback,
            // @ts-ignore
            this.props.qrCodeErrorCallback);
    }
};

export default Html5QrcodePlugin;
