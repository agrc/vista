import { PureComponent } from "react";
import "./MapLens.css";

export default class MapLens extends PureComponent {
  render() {
    return (
      <div id="centerContainer" className="map-lens">
        {this.props.children}
      </div>
    );
  }
}
