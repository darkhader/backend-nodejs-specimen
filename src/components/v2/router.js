import AuthRouter from './Auth/AuthRouter';
import CategoryRouter from './Category/CategoryRouter';
import PostRouter from './Post/PostRouter';
import CommentRouter from './Comment/CommentRouter';
import UserRouter from './User/UserRouter';
import AuthorRouter from './Author/AuthorRouter';
import SearchRouter from './Search/SearchRouter';
import DefaultRouter from './Default/DefaultRouter';
import NotificationRouter from './Notification/NotiRouter';
import GroupRouter from './Group/GroupRouter';
import ReportRouter from './Report/ReportRouter';

export default [
  AuthRouter,
  CategoryRouter,
  PostRouter,
  CommentRouter,
  NotificationRouter,
  GroupRouter,
  ReportRouter,
  UserRouter,
  AuthorRouter,
  SearchRouter,
  DefaultRouter,
];
