export class GeoPoint {
  readonly latitude: number;
  readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    if (latitude < -90 || latitude > 90) throw new Error('Invalid latitude');
    if (longitude < -180 || longitude > 180) throw new Error('Invalid longitude');
    this.latitude = latitude;
    this.longitude = longitude;
  }

  distanceTo(other: GeoPoint): number {
    const R = 6371;
    const dLat = (other.latitude - this.latitude) * Math.PI / 180;
    const dLon = (other.longitude - this.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(this.latitude*Math.PI/180) * Math.cos(other.latitude*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}
