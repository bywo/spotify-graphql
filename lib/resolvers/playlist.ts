import { paginatorFromVariables, syncedPoll } from "../utils";

export function playlistResolvers(spotifyApiClient) {
  return {
    // a playlist can have a large amount of tracks,
    //   so we use `syncedPoll()` helper to avoid
    //   massive API calls at once
    tracks(playlist, variables) {
      return syncedPoll(
        "Playlist.tracks",
        () => {
          return paginatorFromVariables("OffsetPaging", variables)(
            spotifyApiClient,
            "getPlaylistTracks",
            response => response.body.items,
            playlist.owner.id,
            playlist.id
          ).then(tracks => {
            return tracks;
          });
        },
        variables.throttle || 5
      );
    }
  };
}
