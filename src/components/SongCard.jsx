import { RiHeartLine, RiHeartFill, RiMoreFill } from 'react-icons/ri';

export default function SongCard({ song, onFavorite }) {
  return (
    <div className="card group flex items-center justify-between p-4 transition-all hover:border-primary/30">
      <div className="flex items-center gap-4">
        <img 
          src={song.coverUrl} 
          className="w-14 h-14 rounded-lg object-cover"
          alt={song.title}
        />
        <div>
          <h3 className="font-medium">{song.title}</h3>
          <p className="text-muted-foreground text-sm">{song.artist}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onFavorite}
          className="text-xl hover:text-primary transition-colors"
        >
          {song.isFavorite ? (
            <RiHeartFill className="text-primary" />
          ) : (
            <RiHeartLine />
          )}
        </button>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <RiMoreFill />
        </button>
      </div>
    </div>
  );
}